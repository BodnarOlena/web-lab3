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

// Формує рядок списку: день, час, предмет і уточнення (тип, підгрупа, викладач, чергування), якщо вони не null
function describeItem(item) {
  const { lesson, subgroup } = item;
  const details = [];
  if (subgroup.lessonType !== null) details.push(subgroup.lessonType);
  if (subgroup.subgroupNumber !== null) details.push(`підгрупа ${subgroup.subgroupNumber}`);
  if (subgroup.teacher !== null) details.push(subgroup.teacher.fullName);
  if (lesson.weekParity !== null) details.push(lesson.weekParity);

  let text = `${item.day}, ${lesson.time.start} - ${subgroup.subject.name}`;
  if (details.length > 0) {
    text += ` (${details.join(', ')})`;
  }
  return text;
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
  .description('показати список занять')
  .option('-l, --limit <n>', 'показати лише перші n занять')
  .action((options) => {
    const data = loadSchedule(program.opts().file);
    let items = flattenLessons(data);

    if (options.limit !== undefined) {
      const limit = Number(options.limit);
      if (!Number.isInteger(limit) || limit < 1) {
        fail(`значення --limit має бути цілим числом від 1, а не "${options.limit}"`);
      }
      items = items.slice(0, limit);
    }

    items.forEach((item, i) => {
      console.log(`${i + 1}. ${describeItem(item)}`);
    });
  });

program.parse();
