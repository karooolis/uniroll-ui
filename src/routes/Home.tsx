import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

function Home() {
  return (
    <>
      <Button className="mr-3" asChild>
        <Link to="/create">Create</Link>
      </Button>
      <Button className="mr-3" asChild>
        <Link to="/edit">Edit</Link>
      </Button>
    </>
  );
}

export default Home;
