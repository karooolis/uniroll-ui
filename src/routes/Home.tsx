import { Button } from "@/components/ui/button";
import { PlusIcon, Wallet2Icon } from "lucide-react";
import { Link } from "react-router-dom";

function Home() {
  return (
    <>
      <h2 className="my-8 text-2xl">Welcome to the dashboard!</h2>

      <div className="flex gap-x-16">
        <div>
          <h2 className="mb-4 text-lg">
            Create or edit payroll for your contributors
          </h2>

          <Button className="mr-3 w-full" size="lg" asChild>
            <Link to="/create">
              <PlusIcon className="mr-2" /> Create / edit payroll
            </Link>
          </Button>
        </div>

        <div>
          <h2 className="mb-4 text-lg">Configure payments as a receiver</h2>

          <Button className="mr-3 w-full" size="lg" asChild>
            <Link to="/configure">
              <Wallet2Icon className="mr-2" />
              Configure my payments</Link>
          </Button>
        </div>
      </div>
    </>
  );
}

export default Home;
