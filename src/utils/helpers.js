/**
 * Вспомогательные функции
 */

/**
 * Проверяет валидность URL
 */
export function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Задержка выполнения
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Форматирует дату в читаемый вид
 */
export function formatDate(date = new Date()) {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * Генерирует уникальный ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}