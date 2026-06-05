 # Четвертое задание: Система голосований

## Инструкция по запуску проекта

1. Клонировать репозиторий:
git clone https://github.com/DmitriiTMS/MLE-TASK-4

2. Перейти в директорию проекта:
cd MLE-TASK-4

3. Настроить переменные окружения:
Для удобства запуска сразу есть файл .env.production с установленными значениями

4. Запустить проект с помощью Docker:
docker-compose --env-file .env.production up -d

5. Запустить миграции:
yarn migration:run:prod

6. Собрать проект:
yarn build

7. Запустить проект:
yarn start:prod

8. Импортировать коллекцию Postman:
bмпортируйте файл MLE-TASK-4.postman_collection из корня репозитория в Postman.


