import { JobStatus } from '../types';

interface Props {
  status: JobStatus;
}

export default function ProcessingStatus({ status }: Props) {
  const isProcessing = !['complete', 'failed'].includes(status.status);

  return (
    <div className="processing-status">
      <div className="status-header">
        {isProcessing && <span className="spinner" />}
        <span className={`status-badge ${status.status}`}>{status.status}</span>
      </div>
      <p className="progress-text">{status.progress}</p>
      {status.error && <p className="error-text">{status.error}</p>}
    </div>
  );
}
