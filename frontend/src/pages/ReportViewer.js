import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './ReportViewer.css';

const ReportViewer = () => {
  const { reportId } = useParams();
  const [reportUrl, setReportUrl] = useState(null);

  useEffect(() => {
    if (reportId) {
      setReportUrl(`/reports/${reportId}`);
    }
  }, [reportId]);

  return (
    <div className="report-viewer">
      {reportUrl ? (
        <iframe
          src={reportUrl}
          title="Medical Report"
          className="report-frame"
        />
      ) : (
        <div className="report-error">
          <h2>Report Not Found</h2>
          <p>The requested report could not be loaded.</p>
        </div>
      )}
    </div>
  );
};

export default ReportViewer;