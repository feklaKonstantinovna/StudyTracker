import { ST, replaceWithServerData, persist } from '../state.js';
import { showToast } from '../utils/toast.js';

export function downloadBackupJson() {
  const blob = new Blob([JSON.stringify({ version: 3, exportedAt: new Date().toISOString(), data: ST }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'studyflow-backup.json';
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('Бэкап скачан');
}

export function restoreBackupJson(ev) {
  const file = ev.target?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const data = parsed.data && typeof parsed.data === 'object' ? parsed.data : parsed;
      if (!data.schedules && !data.learningGoals && !data.dayData) {
        showToast('Файл не похож на бэкап StudyFlow');
        return;
      }
      if (!confirm('Заменить текущие данные из файла?')) return;
      replaceWithServerData(data);
      persist();
      location.reload();
    } catch {
      showToast('Не удалось прочитать JSON');
    }
  };
  reader.readAsText(file);
  ev.target.value = '';
}
