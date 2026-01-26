import React from 'react';

const StatusTable = () => {
  return (
    <div className="content-section">
      <h2>Status Table</h2>
      <div className="status-table-container">
        <table className="status-table">
          <thead>
            <tr>
              <th>Time Received</th>
              <th>Patient's Name</th>
              <th>Age</th>
              <th>Time Ambulance Left</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Service</th>
              <th>Disposition</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>14:30</td>
              <td>Juan Dela Cruz</td>
              <td>45</td>
              <td>15:15</td>
              <td>45 min</td>
              <td><span className="status-badge received">Received</span></td>
              <td>Cardiology</td>
              <td>Admitted</td>
              <td>Stable condition</td>
            </tr>
            <tr>
              <td>13:45</td>
              <td>Maria Santos</td>
              <td>32</td>
              <td>14:20</td>
              <td>35 min</td>
              <td><span className="status-badge cancelled">Cancelled</span></td>
              <td>Neurology</td>
              <td>-</td>
              <td>Patient improved</td>
            </tr>
            <tr>
              <td>12:15</td>
              <td>Pedro Garcia</td>
              <td>28</td>
              <td>-</td>
              <td>-</td>
              <td><span className="status-badge uncoordinated">Uncoordinated</span></td>
              <td>Emergency</td>
              <td>Pending</td>
              <td>Awaiting transport</td>
            </tr>
            <tr>
              <td>11:30</td>
              <td>Ana Rodriguez</td>
              <td>67</td>
              <td>12:00</td>
              <td>30 min</td>
              <td><span className="status-badge received">Received</span></td>
              <td>Orthopedics</td>
              <td>Surgery</td>
              <td>Hip fracture repair</td>
            </tr>
            <tr>
              <td>10:45</td>
              <td>Carlos Mendoza</td>
              <td>55</td>
              <td>11:20</td>
              <td>35 min</td>
              <td><span className="status-badge received">Received</span></td>
              <td>ICU</td>
              <td>Admitted</td>
              <td>Critical condition</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StatusTable;