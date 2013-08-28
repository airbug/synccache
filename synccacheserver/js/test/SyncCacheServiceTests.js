//TODO BRN: Test to make sure that syncs calls and write calls are separated into separate batches. We want this to
// happen so that synced clients only get updates for writes that occur after the initial syncing. Syncing should
// be a "read" operation type to make this happen

