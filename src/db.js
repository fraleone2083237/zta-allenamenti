import { db, auth } from './firebase.js';
import {
  collection, doc, getDocs, getDoc,
  addDoc, setDoc, deleteDoc, writeBatch,
} from 'firebase/firestore';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getUid() {
  const user = auth.currentUser;
  if (!user) throw new Error('Utente non autenticato');
  return user.uid;
}

function userCol(store) {
  return collection(db, 'users', getUid(), store);
}

function userDoc(store, id) {
  return doc(db, 'users', getUid(), store, String(id));
}

async function fsGetAll(store) {
  const snap = await getDocs(userCol(store));
  return snap.docs.map(d => ({ ...d.data(), id: d.id }));
}

async function fsGet(store, id) {
  const snap = await getDoc(userDoc(store, id));
  if (!snap.exists()) return undefined;
  return { ...snap.data(), id: snap.id };
}

async function fsAdd(store, data) {
  const { id: _removed, ...rest } = data;
  const ref = await addDoc(userCol(store), { ...rest, createdAt: new Date().toISOString() });
  return ref.id;
}

async function fsUpdate(store, data) {
  const { id, ...rest } = data;
  await setDoc(userDoc(store, id), rest);
  return id;
}

async function fsDelete(store, id) {
  await deleteDoc(userDoc(store, String(id)));
}

async function fsClearCollection(store) {
  const snap = await getDocs(userCol(store));
  if (snap.empty) return;
  // writeBatch limit is 500 ops — fine for a personal app
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
}

// ─── Exercises (palestra) ────────────────────────────────────────────────────
export async function getAllExercises() { return fsGetAll('exercises'); }
export async function addExercise(ex) { return fsAdd('exercises', ex); }
export async function updateExercise(ex) { return fsUpdate('exercises', ex); }
export async function deleteExercise(id) { return fsDelete('exercises', id); }

// ─── Workouts (palestra) ─────────────────────────────────────────────────────
export async function getAllWorkouts() { return fsGetAll('workouts'); }
export async function getWorkout(id) { return fsGet('workouts', id); }
export async function addWorkout(w) { return fsAdd('workouts', w); }
export async function updateWorkout(w) { return fsUpdate('workouts', w); }
export async function deleteWorkout(id) { return fsDelete('workouts', id); }

// ─── Run Sessions ─────────────────────────────────────────────────────────────
export async function getAllRunSessions() { return fsGetAll('runSessions'); }
export async function getRunSession(id) { return fsGet('runSessions', id); }
export async function addRunSession(s) { return fsAdd('runSessions', s); }
export async function updateRunSession(s) { return fsUpdate('runSessions', s); }
export async function deleteRunSession(id) { return fsDelete('runSessions', id); }

// ─── Conditioning Exercises ──────────────────────────────────────────────────
export async function getAllConditioningExercises() { return fsGetAll('conditioningExercises'); }
export async function addConditioningExercise(ex) { return fsAdd('conditioningExercises', ex); }
export async function updateConditioningExercise(ex) { return fsUpdate('conditioningExercises', ex); }
export async function deleteConditioningExercise(id) { return fsDelete('conditioningExercises', id); }

// ─── Conditioning Workouts ───────────────────────────────────────────────────
export async function getAllConditioningWorkouts() { return fsGetAll('conditioningWorkouts'); }
export async function getConditioningWorkout(id) { return fsGet('conditioningWorkouts', id); }
export async function addConditioningWorkout(w) { return fsAdd('conditioningWorkouts', w); }
export async function updateConditioningWorkout(w) { return fsUpdate('conditioningWorkouts', w); }
export async function deleteConditioningWorkout(id) { return fsDelete('conditioningWorkouts', id); }

// ─── Other Activities ────────────────────────────────────────────────────────
export async function getAllOtherActivities() { return fsGetAll('otherActivities'); }
export async function getOtherActivity(id) { return fsGet('otherActivities', id); }
export async function addOtherActivity(a) { return fsAdd('otherActivities', a); }
export async function updateOtherActivity(a) { return fsUpdate('otherActivities', a); }
export async function deleteOtherActivity(id) { return fsDelete('otherActivities', id); }

// ─── Body Measurements ───────────────────────────────────────────────────────
export async function getAllBodyMeasurements() { return fsGetAll('bodyMeasurements'); }
export async function addBodyMeasurement(m) { return fsAdd('bodyMeasurements', m); }
export async function updateBodyMeasurement(m) { return fsUpdate('bodyMeasurements', m); }
export async function deleteBodyMeasurement(id) { return fsDelete('bodyMeasurements', id); }

// ─── Profile ─────────────────────────────────────────────────────────────────
export async function getProfile() {
  const snap = await getDoc(userDoc('profile', 'data'));
  return snap.exists() ? snap.data() : {};
}
export async function saveProfile(profile) {
  await setDoc(userDoc('profile', 'data'), profile);
}

// ─── Export / Import ─────────────────────────────────────────────────────────
export async function exportAllData() {
  const [
    exercises, workouts, runSessions,
    conditioningExercises, conditioningWorkouts,
    otherActivities, bodyMeasurements,
  ] = await Promise.all([
    fsGetAll('exercises'), fsGetAll('workouts'), fsGetAll('runSessions'),
    fsGetAll('conditioningExercises'), fsGetAll('conditioningWorkouts'),
    fsGetAll('otherActivities'), fsGetAll('bodyMeasurements'),
  ]);
  const profile = await getProfile();
  return {
    exercises, workouts, runSessions,
    conditioningExercises, conditioningWorkouts,
    otherActivities, bodyMeasurements, profile,
    exportedAt: new Date().toISOString(),
    version: 3,
  };
}

export async function importAllData(data) {
  const dataStores = [
    'exercises', 'workouts', 'runSessions',
    'conditioningExercises', 'conditioningWorkouts',
    'otherActivities', 'bodyMeasurements',
  ];
  await Promise.all(dataStores.map(s => fsClearCollection(s)));
  const adds = [];
  for (const store of dataStores) {
    for (const item of (data[store] || [])) {
      adds.push(fsAdd(store, item));
    }
  }
  await Promise.all(adds);
  if (data.profile) await saveProfile(data.profile);
}
