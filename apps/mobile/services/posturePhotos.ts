import { Directory, File, Paths } from 'expo-file-system';
import type { PostureReport, PostureView } from '../types';

const directory = new Directory(Paths.document, 'shibashi-posture-photos');

function destination(view: PostureView) {
  directory.create({ idempotent: true, intermediates: true });
  return new File(directory, `${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${view}.jpg`);
}

export async function savePostureCapturePhoto(sourceUri: string, view: PostureView) {
  const target = destination(view);
  await new File(sourceUri).copy(target);
  return target.uri;
}

export function deletePostureCapturePhoto(uri: string) {
  if (!uri.startsWith(directory.uri)) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch { /* An unsaved draft may already be gone. */ }
}

export async function migratePostureReportPhotos(reports: PostureReport[]) {
  let changed = false;
  const migrated = reports.map(report => ({
    ...report,
    captures: report.captures.map(capture => {
      const image = capture.imageData;
      if (!image?.startsWith('data:image/jpeg;base64,')) return capture;
      const target = destination(capture.view);
      target.write(image.slice('data:image/jpeg;base64,'.length), { encoding: 'base64' });
      changed = true;
      return { ...capture, imageData: target.uri };
    }),
  }));
  return changed ? migrated : reports;
}
