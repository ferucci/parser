/**
 * Представление для отображения процесса сборки проекта
 * Форматирует вывод информации о создании проекта
 */
export class ProjectView {
  /**
   * Отображает сообщение о начале сборки
   */
  displayStartMessage(projectName) {
    console.log('\n🚀 Запуск сборки проекта...');
    console.log(`📁 Имя проекта: ${projectName}`);
    console.log('═'.repeat(50));
  }

  /**
   * Отображает сообщение о создании структуры папок
   */
  displayStructureCreated() {
    console.log('✅ Структура папок создана');
  }

  /**
   * Отображает сообщение о сохранении HTML
   */
  displayHTMLSaved(htmlPath) {
    console.log(`📄 HTML сохранен: ${htmlPath}`);
  }

  /**
   * Отображает начало загрузки файлов
   */
  displayDownloadStart(fileType) {
    console.log(`\n📥 Загрузка ${fileType}...`);
  }

  /**
   * Отображает результаты загрузки
   */
  displayDownloadResults(fileType, results) {
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`📊 ${fileType}: ${successful} успешно, ${failed} с ошибками`);

    // Показываем ошибки если есть
    results.filter(r => !r.success).forEach(result => {
      console.log(`   ❌ ${result.originalUrl}: ${result.error}`);
    });
  }

  /**
   * Отображает финальный отчет
   */
  displayFinalReport(report) {
    console.log('\n🎉 Сборка проекта завершена!');
    console.log('═'.repeat(50));
    console.log(`📁 Путь к проекту: ${report.projectPath}`);
    console.log(`📦 Скачано скриптов: ${report.stats.scriptsDownloaded}`);
    console.log(`🎨 Скачано стилей: ${report.stats.stylesDownloaded}`);
    console.log(`🖼️  Скачано изображений: ${report.stats.imagesDownloaded}`);
    console.log(`❌ Ошибок: ${report.stats.errors}`);
    console.log(`⏰ Время: ${new Date(report.timestamp).toLocaleString()}`);
    console.log('═'.repeat(50));
  }

  /**
   * Отображает ошибку
   */
  displayError(error) {
    console.error(`\n💥 Ошибка сборки проекта: ${error}`);
  }

  /**
   * Отображает подсказку по использованию
   */
  displayUsage() {
    console.log('\n💡 Использование:');
    console.log('   npm run build-project                    # Сборка проекта по умолчанию');
    console.log('   npm run build-project -- my-project     # Сборка с указанием имени');
    console.log('   node build-project.js custom-project    # Прямой запуск');
  }
}

export default ProjectView;