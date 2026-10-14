import { Command } from 'commander';
import { readFileSync } from 'node:fs';

// Виводить повідомлення про помилку й завершує програму з кодом 1
function fail(message) {
  console.error(`Помилка: ${message}`);
  process.exit(1);
}

// Читає JSON-файл і повертає дані; про проблеми повідомляє українською
function loadSchedule(path) {
  let text;
  try {
    text = readFileSync(path, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      fail(`файл "${path}" не знайдено`);
    }
    fail(`не вдалося прочитати файл "${path}" (${err.code})`);
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    fail(`файл "${path}" містить некоректний JSON`);
  }

  if (!data || !Array.isArray(data.groups)) {
    fail(`у файлі "${path}" немає масиву groups, це не розклад`);
  }
  return data;
}

// Перетворює вкладений розклад на плоский список занять підгруп
function flattenLessons(data) {
  const result = [];
  for (const group of data.groups) {
    for (const day of group.schedule) {
      for (const lesson of day.lessons) {
        for (const subgroup of lesson.subgroups) {
          result.push({ day: day.dayName, lesson, subgroup });
        }
      }
    }
  }
  return result;
}

const program = new Command();

program
  .name('schedule')
  .description('Програма для перегляду розкладу занять групи з JSON-файлу')
  .version('1.0.0', '-V, --version', 'показати версію програми')
  .helpOption('-h, --help', 'показати довідку')
  .option('-f, --file <path>', 'шлях до JSON-файлу з розкладом', 'data.json');

program
  .command('list')
  .description('показати список усіх занять')
  .action(() => {
    const data = loadSchedule(program.opts().file);
    const items = flattenLessons(data);
    items.forEach((item, i) => {
      console.log(`${i + 1}. ${item.day}, ${item.lesson.time.start} - ${item.subgroup.subject.name}`);
    });
  });

program.parse();
