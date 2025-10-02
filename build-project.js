#!/usr/bin/env node

import { config } from './config/config.js';
import { ProjectController } from './src/controllers/ProjectController.js';

/**
 * Точка входа для сборки проекта из результатов парсинга
 */

async function main() {
  const args = process.argv.slice(2);
  const projectName = args[0] || 'project';
  const resultsFile = config.files.results;

  const projectController = new ProjectController();

  try {
    const result = await projectController.buildProjectFromResults(resultsFile, projectName);

    if (!result.success) {
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Критическая ошибка:', error.message);
    process.exit(1);
  }
}

// Обработка аргументов командной строки
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
📦 Project Builder - Сборщик проектов из результатов парсинга

Использование:
  node build-project.js [имя-проекта]
  npm run build-project [-- имя-проекта]

Примеры:
  node build-project.js                    # Создаст проект 'project'
  node build-project.js my-website         # Создаст проект 'my-website'
  npm run build-project -- my-app         # Через npm с именем 'my-app'

Требования:
  - Файл результатов парсинга (${config.files.results})
  - Доступ к интернету для загрузки ресурсов
  `);
  process.exit(0);
}

main().catch(console.error);