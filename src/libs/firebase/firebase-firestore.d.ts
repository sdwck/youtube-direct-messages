export type DocumentData = { [field: string]: any };
export type Unsubscribe = () => void;

export class Timestamp {
  constructor(seconds: number, nanoseconds: number);
  static now(): Timestamp;
  toDate(): Date;
}

export interface DocumentReference<T = DocumentData> { id: string; }
export interface CollectionReference<T = DocumentData> { id: string; }

export interface DocumentSnapshot<T = DocumentData> {
  readonly id: string;
  exists(): this is QueryDocumentSnapshot<T>;
  data(): T | undefined;
}

export interface QueryDocumentSnapshot<T = DocumentData> extends DocumentSnapshot<T> {
  data(): T;
}

export interface QuerySnapshot<T = DocumentData> {
  readonly empty: boolean;
  readonly docs: QueryDocumentSnapshot<T>[];
  forEach(callback: (result: QueryDocumentSnapshot<T>) => void): void;
  docChanges(): Array<{ doc: QueryDocumentSnapshot<T>; type: 'added' | 'modified' | 'removed'; oldIndex: number; newIndex: number }>;
}

export interface WriteBatch {
  set<T>(documentRef: DocumentReference<T>, data: T, options?: { merge?: boolean }): WriteBatch;
  update<T>(documentRef: DocumentReference<T>, data: Partial<T>): WriteBatch;
  delete(documentRef: DocumentReference<any>): WriteBatch;
  commit(): Promise<void>;
}

export function getFirestore(app?: any): any;
export function collection(firestore: any, path: string, ...pathSegments: string[]): CollectionReference;
export function collection(reference: DocumentReference, path: string, ...pathSegments: string[]): CollectionReference;
export function doc(firestore: any, path: string, ...pathSegments: string[]): DocumentReference;
export function doc<T>(reference: CollectionReference<T>, path?: string): DocumentReference<T>;
export function query(query: any, ...constraints: any[]): any;
export function where(fieldPath: string, opStr: string, value: any): any;
export function orderBy(fieldPath: string, directionStr?: 'asc' | 'desc'): any;
export function getDocs<T>(query: any): Promise<QuerySnapshot<DocumentData>>;
export function getDoc<T>(docRef: DocumentReference<T>): Promise<DocumentSnapshot<T>>;
export function addDoc<T>(collectionRef: CollectionReference<T>, data: T): Promise<DocumentReference<T>>;
export function setDoc<T>(docRef: DocumentReference<T>, data: T, options?: { merge?: boolean }): Promise<void>;
export function updateDoc<T>(docRef: DocumentReference<T>, data: Partial<T>): Promise<void>;
export function onSnapshot<T>(query: any, callback: (snapshot: QuerySnapshot<DocumentData>) => void): Unsubscribe;
export function writeBatch(firestore: any): WriteBatch;
export function serverTimestamp(): any;
export function limit(limit: number): any;
export function startAfter(snapshot: QueryDocumentSnapshot): any;
export function startAfter(...fieldValues: any[]): any;
export function endBefore(snapshot: QueryDocumentSnapshot): any;
export function startAt(snapshot: QueryDocumentSnapshot): any;
export function limitToLast(limit: number): any;
export function collectionData<T>(collectionRef: CollectionReference<T>, options?: { idField?: string }): Promise<T[]>;
export function arrayUnion(...elements: any[]): any;
export function arrayRemove(...elements: any[]): any;
export function deleteDoc(reference: DocumentReference<any>): Promise<void>;
export function runTransaction<T>(firestore: any, updateFunction: (transaction: any) => Promise<T>): Promise<T>;