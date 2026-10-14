import { Command } from 'commander';

const program = new Command();

program
  .name('schedule')
  .description('Програма для перегляду розкладу занять групи з JSON-файлу')
  .version('1.0.0', '-V, --version', 'показати версію програми')
  .helpOption('-h, --help', 'показати довідку')
  .option('-f, --file <path>', 'шлях до JSON-файлу з розкладом', 'data.json');

program.parse();
