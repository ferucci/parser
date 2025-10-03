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

  displayDownloadResults(fileType, results) {
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success && !r.security).length;
    const blocked = results.filter(r => !r.success && r.security).length;

    console.log(`📊 ${fileType}: ${successful} успешно, ${failed} ошибок, ${blocked} заблокировано`);

    // Показываем ошибки безопасности
    results.filter(r => !r.success && r.security).forEach(result => {
      console.log(`   🛡️  БЛОКИРОВКА: ${result.originalUrl}`);
      console.log(`      ↳ ${result.error}`);
    });

    // Показываем обычные ошибки
    results.filter(r => !r.success && !r.security).forEach(result => {
      console.log(`   ❌ ${result.originalUrl}: ${result.error}`);
    });
  }

  /**
   * Отображает финальный отчет с информацией о безопасности
   */
  displayFinalReport(report) {
    console.log('\n🎉 Сборка проекта завершена!');
    console.log('═'.repeat(50));
    console.log(`📁 Путь к проекту: ${report.projectPath}`);
    console.log(`🔧 Скачано скриптов: ${report.stats.scriptsDownloaded}`);
    console.log(`🎨 Скачано стилей: ${report.stats.stylesDownloaded}`);
    console.log(`🖼️  Скачано изображений: ${report.stats.imagesDownloaded}`);
    console.log(`📦 Скачано других файлов: ${report.stats.otherFilesDownloaded}`);
    console.log(`❌ Ошибок загрузки: ${report.stats.errors}`);
    console.log(`🛡️  Блокировок безопасности: ${report.stats.securityBlocks}`);
    console.log(`⚙️  Настройки безопасности:`);
    console.log(`   Макс. размер файла: ${this.formatBytes(report.security.maxFileSize)}`);
    console.log(`   Разрешённых расширений: ${report.security.allowedExtensions}`);
    console.log(`   Заблокированных паттернов: ${report.security.blockedPatterns}`);
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