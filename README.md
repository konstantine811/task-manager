# Task Manager

Окремий додаток «Менеджер завдань», винесений з портфоліо [3d-react-abc-folio](../3d-react-abc-folio).

## Запуск

```bash
npm install
cp .env.example .env   # додати VITE_FIREBASE_* (можна взяти з портфоліо)
npm run dev
```

Додаток відкривається на **http://localhost:5174**.

## Збірка

```bash
npm run build
npm run preview   # перегляд production-збірки
```

## Маршрути

- `/` — редірект на `/template`
- `/template` — шаблон завдань
- `/daily/:id` — щоденні завдання за датою (id у форматі `yyyy-MM-dd`)
- `/analytics` — аналітика

## Firebase

Використовується той самий Firebase-проєкт, що й у портфоліо (колекції `template-tasks`, `daily-tasks`, `planned-tasks`, `daily-analytics`), щоб дані були спільними.

## Далі

Повна міграція UI (dnd, сторінки, компоненти) описана в портфоліо:  
[docs/TASK_MANAGER_MIGRATION.md](../3d-react-abc-folio/docs/TASK_MANAGER_MIGRATION.md).
