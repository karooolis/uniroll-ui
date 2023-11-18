import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

function Home() {
  return (
    <>
      <h2 className="my-8 text-2xl">Welcome!</h2>

      <Button className="mr-3" asChild>
        <Link to="/create">Create</Link>
      </Button>

      <Button className="mr-3" asChild>
        <Link to="/edit">Edit</Link>
      </Button>

      <Button className="mr-3" asChild>
        <Link to="/configure">Configure (as receiver)</Link>
      </Button>
    </>
  );
}

export default Home;
