import { useState } from 'react';
import { Accordion, Button, Form, Modal } from 'react-bootstrap';
import ApiClient from '../api';
import toast from 'react-hot-toast';

interface CreateSessionDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const apiClient = new ApiClient();

export function CreateSessionDialog({ open, setOpen }: CreateSessionDialogProps) {
  const [input, setInput] = useState({
    sessionName: '',
    duration: '',
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

    const data = await apiClient.createSession(input.sessionName, parseInt(input.duration), input.username, input.password);
    console.log(data);

    if (!data.success) {
      toast.error(data.message);
    } else {
      toast.success(data.message);
      setOpen(false);
      window.location.reload();
    }
  };

  const handleClose = () => setOpen(false);

  return (
    <Modal show={open} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Create session</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
            <Form.Control type="text" placeholder="Enter session name" name="sessionName" value={input.sessionName} onChange={handleChange} autoFocus />
          </Form.Group>
          <Form.Group className="mb-3" controlId="exampleForm.ControlTextarea2">
            <Form.Control type="number" placeholder="Enter duration (mins)" name="duration" value={input.duration} onChange={handleChange} />
          </Form.Group>

          <Accordion defaultActiveKey="0">
            <Accordion.Item eventKey="0">
              <Accordion.Header>Credentials</Accordion.Header>
              <Accordion.Body>
                <Form.Group className="mb-3" controlId="exampleForm.ControlInput3">
                  <Form.Control type="text" placeholder="Enter username" name="username" value={input.username} onChange={handleChange} />
                </Form.Group>
                <Form.Group className="mb-3" controlId="exampleForm.ControlTextarea4">
                  <Form.Control type="password" placeholder="Enter password" name="password" value={input.password} onChange={handleChange} />
                </Form.Group>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Create
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
