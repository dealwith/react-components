import React, { useRef } from 'react';
import { c } from 'ttag';
import { OpenPGPKey } from 'pmcrypto';
import { Badge, Button, LoaderIcon, Table, TableRow, TableHeader, TableBody } from '../../../components';

import SelectKeyFiles from '../shared/SelectKeyFiles';

import KeysStatus from '../KeysStatus';
import { Status, ReactivateKeys, ReactivateKey } from './interface';
import { FileInputHandle } from '../../../components/input/FileInput';

const getStatus = (status: Status, result: any) => {
    if (status === Status.ERROR) {
        return (
            <Badge type="error" tooltip={result?.message}>
                {c('Key state badge').t`Error`}
            </Badge>
        );
    }
    if (status === Status.INACTIVE || status === Status.UPLOADED) {
        return <KeysStatus isDecrypted={false} />;
    }
    if (status === Status.SUCCESS) {
        return <KeysStatus isDecrypted />;
    }
};

interface Props {
    loading?: boolean;
    allKeys: ReactivateKeys[];
    onUpload?: (key: ReactivateKey, files: OpenPGPKey[]) => void;
}
const ReactivateKeysList = ({ loading = false, allKeys, onUpload }: Props) => {
    const inactiveKeyRef = useRef<ReactivateKey>();
    const selectRef = useRef<FileInputHandle>(null);

    const isUpload = !!onUpload;

    const handleFiles = (files: OpenPGPKey[]) => {
        if (!inactiveKeyRef.current || !onUpload) {
            return;
        }
        onUpload(inactiveKeyRef.current, files);
        inactiveKeyRef.current = undefined;
    };

    const list = allKeys
        .map(({ User, Address, keys }) => {
            const email = Address ? Address.Email : User.Name;

            return keys.map((inactiveKey) => {
                const { ID, fingerprint, uploadedPrivateKey, status, result } = inactiveKey;

                const keyStatus = loading && !result ? <LoaderIcon /> : getStatus(status, result);

                const uploadColumn = uploadedPrivateKey ? (
                    <Badge type="success">{c('Key status displayed in a badge').t`Key uploaded`}</Badge>
                ) : (
                    <Button
                        onClick={() => {
                            inactiveKeyRef.current = inactiveKey;
                            selectRef.current?.click();
                        }}
                    >
                        {c('Action').t`Upload`}
                    </Button>
                );

                return (
                    <TableRow
                        key={ID}
                        cells={[
                            <span key={0} className="mw100 inbl ellipsis">
                                {email}
                            </span>,
                            <code key={1} className="mw100 inbl ellipsis">
                                {fingerprint}
                            </code>,
                            keyStatus,
                            isUpload ? uploadColumn : null,
                        ].filter(Boolean)}
                    />
                );
            });
        })
        .flat();

    return (
        <>
            {isUpload ? (
                <SelectKeyFiles
                    ref={selectRef}
                    multiple={false}
                    onFiles={handleFiles}
                    className="hidden"
                    autoClick={false}
                />
            ) : null}
            <Table className="pm-simple-table--has-actions">
                <TableHeader
                    cells={[
                        c('Title header for keys table').t`Email`,
                        c('Title header for keys table').t`Fingerprint`,
                        c('Title header for keys table').t`Status`,
                        isUpload ? c('Title header for keys table').t`Action` : null,
                    ].filter(Boolean)}
                />
                <TableBody>{list}</TableBody>
            </Table>
        </>
    );
};

export default ReactivateKeysList;
