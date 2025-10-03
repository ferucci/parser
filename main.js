import { config } from './config/config.js';
import { ParserController } from './src/controllers/ParserController.js';

/**
 * Главный файл приложения - точка входа
 * Инициализирует контроллер и запускает процесс парсинга
 */
async function main() {
  console.log('🚀 Запуск парсера с архитектурой MVC (ES Modules)...\n');

  const parser = new ParserController({
    delay: config.parser.delay,
    concurrent: config.parser.concurrent
  });

  // Обработчик завершения очереди
  parser.on(config.events.QUEUE_FINISHED, async () => {
    console.log('\n🎉 Очередь обработки завершена!');

    // Сохраняем результаты
    await parser.saveResults();

    // Показываем финальную статистику
    const stats = parser.getStats();
    console.log(`\n📈 Финальная статистика:`);
    console.log(`   Обработано URL: ${stats.totalProcessed}`);
    console.log(`   Осталось в очереди: ${stats.totalUrlsInQueue}`);

    process.exit(0);
  });

  // Добавляем URL в очередь
  parser.addToQueue('https://ls-lighting.ru/');
  // parser.addToQueue('https://github.com');

  // Запускаем обработку очереди
  await parser.processQueue();
}

// Обработчик ошибок
process.on('unhandledRejection', (error) => {
  console.error('❌ Необработанная ошибка:', error);
  process.exit(1);
});

// Запуск приложения
main().catch(console.error);