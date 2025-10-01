/**
 * Представление для вывода информации в консоль
 * Отвечает за форматирование и отображение данных пользователю
 */
export class ConsoleView {
  /**
   * Отображает данные о распарсенной странице
   */
  displayParsedData({ url, data }) {
    console.log(`\n📄 Обработано: ${url}`);
    console.log(`   📝 Заголовок: ${data.title}`);
    console.log(`   🔧 Скрипты: ${data.scriptsCount} (${data.externalScriptsCount} внешних)`);
    console.log(`   🎨 Стили: ${data.stylesCount} (${data.externalStylesCount} внешних)`);
    console.log(`   📏 Размер HTML: ${this.formatBytes(data.htmlLength)}`);
  }

  /**
   * Отображает сообщение об ошибке
   */
  displayError({ url, error }) {
    console.error(`\n❌ Ошибка обработки ${url}:`);
    console.error(`   ${error}`);
  }

  /**
   * Отображает информационное сообщение
   */
  displayMessage(message) {
    console.log(`ℹ️  ${message}`);
  }

  /**
   * Отображает сообщение об успехе
   */
  displaySuccess(message) {
    console.log(`✅ ${message}`);
  }

  /**
   * Отображает сводную статистику
   */
  displaySummary(summary) {
    console.log('\n📊 Сводная статистика:');
    summary.forEach(item => {
      console.log(`   ${item.url}: ${item.scripts} скриптов, ${item.styles} стилей`);
    });
  }

  /**
   * Форматирует байты в читаемый вид
   */
  formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}

export default ConsoleView;