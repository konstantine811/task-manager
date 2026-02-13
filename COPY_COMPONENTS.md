# Інструкція для копіювання компонентів

## 1. UI компоненти (src/components/ui/)

Скопіювати з `3d-react-abc-folio/src/components/ui/` в `task-manager/src/components/ui/`:

- ✅ button.tsx (вже скопійовано)
- checkbox.tsx
- tooltip.tsx
- label.tsx
- calendar.tsx
- table.tsx
- select.tsx
- form.tsx
- popover.tsx
- dropdown-menu.tsx
- toggle-group.tsx
- toggle.tsx
- scroll-area.tsx
- textarea.tsx
- input.tsx
- dialog.tsx
- drawer.tsx
- progress.tsx
- sliding-number.tsx
- morphing-popover.tsx

**Важливо:** У всіх файлах залишити імпорти `@/` — alias вже налаштований.

## 2. UI-ABC компоненти (src/components/ui-abc/)

Скопіювати з `3d-react-abc-folio/src/components/ui-abc/` в `task-manager/src/components/ui-abc/`:

- dialog/dialog.tsx
- dialog/dialog-agree.tsx
- dialog/task/label-tooltip.tsx
- dialog/task/label-text-area.tsx
- dialog/task/label-select-option.tsx
- dialog/task/label-select-week.tsx
- dialog/task/label-check-data.tsx
- drawer/custom-drawer.tsx
- inputs/input-combobox.tsx
- inputs/input-number.tsx
- select/select-time.tsx
- sound-hover-element.tsx
- wrapper-hover-element.tsx
- buttons/sound-button.tsx

## 3. DND компоненти (src/components/dnd/)

Скопіювати **всю папку** `3d-react-abc-folio/src/components/dnd/` в `task-manager/src/components/dnd/`.

## 4. Сторінки task-manager

Скопіювати **всю папку** `3d-react-abc-folio/src/components/page-partials/pages/task-manager/` в `task-manager/src/pages/` (зберегти структуру підпапок).

Потім оновити імпорти в `src/config/routes.tsx`:
- `@/pages/TemplateTask` → `@/pages/pages/TemplateTask`
- `@/pages/DailyTask` → `@/pages/pages/DailyTask`
- `@/pages/Analytics` → `@/pages/pages/Analytics`

Або краще: перемістити файли так, щоб структура була:
- `src/pages/TemplateTask.tsx` (головний файл)
- `src/pages/daily-components/` (підпапки)
- `src/pages/template-components/`
- `src/pages/analytics-comonents/`
- тощо

## 5. Додаткові залежності

Вже додано до package.json:
- ✅ motion (framer-motion)
- ✅ react-use-measure
- ✅ vaul

## 6. Workers та Preloader

- Скопіювати `src/workers/analyticsWorker` → `task-manager/src/workers/analyticsWorker`
- Скопіювати `Preloader` або створити простий спіннер

## 7. Після копіювання

1. Запустити `npm install` в task-manager
2. Перевірити імпорти — всі `@/` мають працювати
3. Виправити помилки компіляції (якщо є)
4. Запустити `npm run dev` та перевірити роботу

## Швидкий скрипт для копіювання (macOS/Linux)

```bash
# З кореня task-manager
SOURCE="../3d-react-abc-folio/src"

# UI компоненти
cp -r "$SOURCE/components/ui"/*.tsx src/components/ui/ 2>/dev/null || true

# UI-ABC компоненти
mkdir -p src/components/ui-abc/{dialog/task,drawer,inputs,select,buttons}
cp -r "$SOURCE/components/ui-abc/dialog" src/components/ui-abc/
cp -r "$SOURCE/components/ui-abc/drawer" src/components/ui-abc/
cp -r "$SOURCE/components/ui-abc/inputs" src/components/ui-abc/
cp -r "$SOURCE/components/ui-abc/select" src/components/ui-abc/
cp -r "$SOURCE/components/ui-abc/buttons" src/components/ui-abc/
cp "$SOURCE/components/ui-abc/sound-hover-element.tsx" src/components/ui-abc/
cp "$SOURCE/components/ui-abc/wrapper-hover-element.tsx" src/components/ui-abc/

# DND
cp -r "$SOURCE/components/dnd" src/components/

# Сторінки
cp -r "$SOURCE/components/page-partials/pages/task-manager" src/pages/
```
