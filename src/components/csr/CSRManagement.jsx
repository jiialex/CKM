import { useState } from "react";
import CSRTable from '../../pages/dashboard/CSRTable';
import CSRDetailView from '../layout/CSRDetailView';

export default function CSRManagement() {
  const [selectedCsr, setSelectedCsr] = useState(null);

  const handleBack = () => {
    setSelectedCsr(null);
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50 dark:bg-[#0A0D12]">
      {selectedCsr ? (
        <CSRDetailView
          csr={selectedCsr}
          onBack={handleBack}
          onDeleted={handleBack}
        />
      ) : (
        <CSRTable onSelect={setSelectedCsr} />
      )}
    </div>
  );
}