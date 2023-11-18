import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

function Edit() {
  return (
    <>
      <h2 className="my-8 text-2xl">
        <Link to="/">
          <ChevronLeft className="h-6 w-6 inline-block opacity-50" />
        </Link>{" "}
        Edit payroll
      </h2>
    </>
  );
}

export default Edit;
