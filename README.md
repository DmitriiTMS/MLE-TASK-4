 # Четвертое задание: Система голосований

## Инструкция по запуску проекта

1. Клонировать репозиторий:
git clone https://github.com/DmitriiTMS/MLE-TASK-4

2. Перейти в директорию проекта:
cd MLE-TASK-4

3. Настроить переменные окружения:
для удобства запуска сразу есть файл .env.production с установленными значениями

4. Установить зависимости:
yarn install

5. Запустить проект с помощью Docker:
docker-compose --env-file .env.production up -d

6. Запустить миграции:
yarn migration:run:prod

7. Собрать проект:
yarn build

8. Запустить проект:
yarn start:prod

9. Импортировать коллекцию Postman:
импортируйте файл MLE-TASK-4.postman_collection из корня репозитория в Postman.


