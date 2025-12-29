require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'))

// In-memory storage (в реальном проекте используй базу данных)
let meetings = [];
let users = [];

// Настройка почтового транспорта
const transporter = nodemailer.createTransport({
	service: 'gmail', // или другой сервис
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS
	}
});

// Проверка конфигурации почты
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
	console.log('⚠️  Внимание: EMAIL_USER и EMAIL_PASS не настроены в .env файле');
}

// API Routes

// Регистрация пользователя
app.post('/api/register', (req, res) => {
	const { email, name } = req.body;
	
	if (!email || !name) {
		return res.status(400).json({ error: 'Email и имя обязательны' });
	}

	// Проверяем, не зарегистрирован ли уже пользователь
	const existingUser = users.find(user => user.email === email);
	if (existingUser) {
		return res.status(400).json({ error: 'Пользователь с таким email уже зарегистрирован' });
	}

	const newUser = {
		id: Date.now().toString(),
		email,
		name,
		registeredAt: new Date()
	};

	users.push(newUser);
	console.log(`✅ Пользователь зарегистрирован: ${email}`);

	res.json({ 
		success: true, 
		message: 'Регистрация успешна!',
		user: newUser 
	});
});

// Создание встречи
app.post('/api/create-meeting', async (req, res) => {
	const { title, description, date, time, participants, organizer } = req.body;

	if (!title || !date || !time || !participants || !organizer) {
		return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
	}

	const meeting = {
		id: Date.now().toString(),
		title,
		description,
		date,
		time,
		participants: Array.isArray(participants) ? participants : [participants],
		organizer,
		createdAt: new Date()
	};

	meetings.push(meeting);
	console.log(`✅ Встреча создана: ${title}`);

	// Отправка уведомлений участникам
	try {
		await sendMeetingNotifications(meeting);
		res.json({ 
			success: true, 
			message: 'Встреча создана и уведомления отправлены!',
			meeting 
		});
	} catch (error) {
		console.error('Ошибка при отправке уведомлений:', error);
		res.status(500).json({ 
			error: 'Встреча создана, но произошла ошибка при отправке уведомлений' 
		});
	}
});

// Получение списка пользователей
app.get('/api/users', (req, res) => {
	res.json(users);
});

// Функция отправки уведомлений
async function sendMeetingNotifications(meeting) {
	const emailPromises = meeting.participants.map(async (participantEmail) => {
		const participant = users.find(user => user.email === participantEmail);
		const participantName = participant ? participant.name : 'Уважаемый коллега';

		const mailOptions = {
			from: process.env.EMAIL_USER,
			to: participantEmail,
			subject: `Приглашение на встречу: ${meeting.title}`,
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2 style="color: #333;">Приглашение на встречу</h2>
					<div style="background: #f5f5f5; padding: 20px; border-radius: 5px;">
						<h3>${meeting.title}</h3>
						${meeting.description ? `<p><strong>Описание:</strong> ${meeting.description}</p>` : ''}
						<p><strong>Дата:</strong> ${meeting.date}</p>
						<p><strong>Время:</strong> ${meeting.time}</p>
						<p><strong>Организатор:</strong> ${meeting.organizer}</p>
					</div>
					<p style="margin-top: 20px;">Пожалуйста, подтвердите свое участие.</p>
					<hr>
					<p style="color: #666; font-size: 12px;">Это автоматическое уведомление от системы встреч.</p>
				</div>
			`
		};

		try {
			await transporter.sendMail(mailOptions);
			console.log(`✅ Уведомление отправлено: ${participantEmail}`);
			return { email: participantEmail, status: 'success' };
		} catch (error) {
			console.error(`❌ Ошибка отправки на ${participantEmail}:`, error);
			return { email: participantEmail, status: 'error', error: error.message };
		}
	});

	return Promise.all(emailPromises);
}

// Запуск сервера
app.listen(PORT, () => {
	console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
	console.log(`📧 Почта для уведомлений: ${process.env.EMAIL_USER || 'Не настроена'}`);
});