import { useState } from 'react';
import { Button, Form, Table } from 'react-bootstrap';
import ApiClient from '@/services/sessions.service';
import toast from 'react-hot-toast';

interface Session {
  id: number;
  name: string;
  created_at: string;
  duration: string;
  active: boolean;
}

const apiClient = new ApiClient();

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const options: any = {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };
  const formattedDate = date.toLocaleString('en-GB', options);
  console.log(formattedDate);

  return formattedDate;
};

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [error, setError] = useState<string | null>();

  const [input, setInput] = useState({
    username: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInput((prevInput) => ({
      ...prevInput,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(input);
    setError(null);
    const data = await apiClient.viewSessions(input.username, input.password);
    if (data.success) {
      setSessions(data.sessions);
    }
  };

  const handleActiveChange = async (sessionId: number, isActive: boolean) => {
    const res = await apiClient.updateSession(sessionId, isActive, input.username, input.password);
    if (res.success) {
      const updatedSessions = sessions.map((session: Session) => (session.id === sessionId ? { ...session, active: isActive } : session));
      setSessions(updatedSessions);
    } else {
      toast.error(res.message);
    }
  };

  const handleDownload = () => {
    // Download removed: attendance data no longer available
    console.warn('Download not available');
  };

  return (
    <div className="pt-4 d-flex flex-column align-items-center">
      {/* credentials */}
      <div className="w-lg-400">
        <Form>
          <Form.Group className="mb-3">
            <Form.Control type="text" autoComplete="username" placeholder="Enter username" name="username" value={input.username} onChange={handleChange} className="w-full text-center border-2" />
            <Form.Control autoComplete="current-password" type="password" placeholder="Enter password" name="password" value={input.password} onChange={handleChange} className="w-full mt-2 text-center border-2" />
            <div className="d-grid gap-2 mt-3">
              <Button variant="primary" onClick={handleSubmit}>
                View session
              </Button>
            </div>
          </Form.Group>
        </Form>
      </div>
      {/* sessions */}
      {sessions.length > 0 && (
        <div>
          <Table>
            <thead>
              <tr>
                <th>Session</th>
                <th>Created at</th>
                
                <th>Active</th>
                <th className="text-right">Export (csv)</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td>{session.name}</td>
                  <td>{formatDate(session.created_at)}</td>
                  <td>—</td>
                  <td>
                    <Form.Check type="switch" checked={session.active} id="custom-switch" onChange={(e) => handleActiveChange(session.id, e.target.checked)} />
                  </td>
                  <td className="text-right">
                    <Button
                      variant="link"
                      className="text-primary hover:text-primary/80"
                      onClick={handleDownload}
                    >
                      Download
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <p className="fs-6 text-danger">{error}</p>
    </div>
  );
}
