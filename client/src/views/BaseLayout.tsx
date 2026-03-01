import { ReactNode, useState } from "react";
import { Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { CreateSessionDialog } from "./CreateSessionDialog";

interface BaseLayoutProps {
  children: ReactNode;
}

const BaseLayout: React.FC<BaseLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div className="layout">
      <header className="d-flex align-items-center my-1 bg-light navbar-mx">
        <h3>
          <Link className="text-decoration-none text-dark" to="/">
            Attendance
          </Link>
        </h3>
        <div className="flex-grow-1"></div>
        <nav>
          <ul className="nav">
            <li className="nav-item">
              <Button variant="outline-secondary" className="me-2" onClick={() => navigate("/sessions")}>
                Sessions
              </Button>
              <Button variant="success" className="text-white" onClick={() => setIsCreateDialogOpen(true)}>
                Create
              </Button>
            </li>
          </ul>
        </nav>
      </header>
      <main id="content">{children}</main>

      <CreateSessionDialog open={isCreateDialogOpen} setOpen={setIsCreateDialogOpen} />
    </div>
  );
};

export default BaseLayout;
