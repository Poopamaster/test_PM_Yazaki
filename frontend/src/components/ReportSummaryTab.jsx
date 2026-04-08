import React from 'react';

const ReportSummaryTab = ({
    startDate,
    endDate,
    summaryData,
    markerColors,
    sumTotalEq,
    sumTotalDone,
    sumTotalCost,
    onExportExcel
}) => {
    return (
        <div id="report-summary">
            <div className="summary-header flex justify-between items-center" style={{ marginBottom: '15px' }}>
                <h3 className="summary-title" style={{ margin: 0 }}>
                    ผลการดำเนินงานตั้งแต่ {new Date(startDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} - {new Date(endDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </h3>
                <button className="btn btn-success btn-sm" onClick={onExportExcel}>Export Excel</button>
            </div>

            <div className="card">
                <div className="table-wrap">
                    <table className="report-table">
                        <thead>
                            <tr>
                                <th className="text-left">กลุ่มอุปกรณ์</th>
                                <th className="text-center">จำนวนเครื่องทั้งหมด</th>
                                <th className="text-center">PM ที่ทำแล้ว (ตามช่วงเวลา)</th>
                                <th className="text-right">ค่าใช้จ่ายรวม</th>
                            </tr>
                        </thead>
                        <tbody>
                            {summaryData.map((item, idx) => (
                                <tr key={item.id}>
                                    <td>
                                        <span className="marker-box" style={{ background: markerColors[idx % markerColors.length], display: 'inline-block', width: '12px', height: '12px', marginRight: '8px', borderRadius: '2px' }}></span>
                                        {item.name}
                                    </td>
                                    <td className="text-center">{item.eqCount}</td>
                                    <td className="text-center">{item.pmDoneCount}</td>
                                    <td className="text-right cost-val">฿{item.costInPeriod.toLocaleString()}</td>
                                </tr>
                            ))}
                            <tr className="report-table-footer">
                                <td><strong>รวมทั้งหมด</strong></td>
                                <td className="text-center"><strong>{sumTotalEq}</strong></td>
                                <td className="text-center"><strong>{sumTotalDone}</strong></td>
                                <td className="text-right total-cost"><strong>฿{sumTotalCost.toLocaleString()}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReportSummaryTab;