import { LABEL_TYPE } from 'proton-shared/lib/constants';

import { TIME_UNIT } from './constants';

export enum DestinationFolder {
    INBOX = 'Inbox',
    ALL_DRAFTS = 'All Drafts',
    ALL_SENT = 'All Sent',
    TRASH = 'Trash',
    SPAM = 'Spam',
    ALL_MAIL = 'All Mail',
    STARRED = 'Starred',
    ARCHIVE = 'Archive',
    SENT = 'Sent',
    DRAFTS = 'Drafts',
}

export enum IMPORT_ERROR {
    AUTH_IMAP = 2000,
    AUTH_CREDENTIALS = 2902,
    ALREADY_EXISTS = 2500,
}

export interface ImportedFolder {
    SourceFolder: string;
    DestinationFolder?: DestinationFolder;
    Processed: number;
    Total: number;
}

export interface MailImportFolder {
    Source: string;
    Separator: string;
    Total: number;
    Flags: string[];
    DestinationFolder?: DestinationFolder;
    Size: number;
}

export enum Step {
    START,
    PREPARE,
    STARTED,
}

export interface ImportModalModel {
    providerFolders: MailImportFolder[];
    step: Step;
    needIMAPDetails: boolean;
    importID: string;
    email: string;
    password: string;
    port: string;
    imap: string;
    errorCode: number;
    errorLabel: string;
    selectedPeriod: TIME_UNIT;
    payload: ImportPayloadModel;
    isPayloadValid: boolean;
}

export interface FolderMapping {
    Source: string;
    Destinations: {
        FolderName: string;
    };
    checked: boolean;
}

export interface ImportPayloadModel {
    AddressID?: string;
    Code?: string;
    ImportLabel?: {
        Name: string;
        Color: string;
        Type: LABEL_TYPE;
        Order: number;
    };
    StartTime?: Date;
    EndTime?: Date;
    Mapping: FolderMapping[];
}

export enum ImportMailStatus {
    QUEUED = 0,
    RUNNING = 1,
    DONE = 2,
    FAILED = 3,
    PAUSED = 4,
    CANCELED = 5,
}

export interface ImportMail {
    ID: string;
    CreateTime: number;
    Email: string;
    AddressID: string;
    State: ImportMailStatus;
    FilterStartDate: string;
    FilterEndDate: string;
    Mapping: ImportedFolder[];
}

export enum ImportMailReportStatus {
    QUEUED = 0,
    RUNNING = 1,
    DONE = 2,
    FAILED = 3,
    PAUSED = 4,
    CANCELED = 5,
}

export interface ImportMailReport {
    ID: string;
    Email: string;
    CreateTime: number;
    EndTime: number;
    NumMessages: number;
    State: ImportMailReportStatus;
    TotalSize: number;
}

export interface CheckedFoldersMap {
    [key: string]: boolean;
}

export interface DisabledFoldersMap {
    [key: string]: boolean;
}

export interface FolderRelationshipsMap {
    [key: string]: string[];
}

export interface FolderNamesMap {
    [key: string]: string;
}

export interface FolderPathsMap {
    [key: string]: string;
}