import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getContract } from "@wagmi/core";

import payrollHandlerAbi from "../abis/payroll-handler.json";
import wagmigotchiABI from "../abis/wagmigotchi.json";
import {
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
} from "wagmi";
import { CONTRACT_ADDRESS } from "@/consts";

const receiversMock: Receiver[] = [
  {
    cadence: "3600",
    amount: 250.25,
    address: "0x1234...5671",
    token: "0x1234...5671",
    chain: "Ethereum",
  },
  {
    cadence: "3600",
    amount: 250.25,
    address: "0x1234...5672",
    token: "0x1234...5671",
    chain: "Celo",
  },
  {
    cadence: "3600",
    amount: 250.25,
    address: "0x1234...5673",
    token: "0x1234...5671",
    chain: "Gnosis",
  },
  {
    cadence: "3600",
    amount: 250.25,
    address: "0x1234...5674",
    token: "0x1234...5671",
    chain: "Ethereum",
  },
  {
    cadence: "3600",
    amount: 250.25,
    address: "0x1234...5675",
    token: "0x1234...5671",
    chain: "Ethereum",
  },
];

export type Receiver = {
  address: string;
  token: string;
  amount: number;
  cadence: string;
  chain: string;
};

export const columns: ColumnDef<Receiver>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "address",
    header: "Receiver",
    cell: ({ row }) => <div>{row.getValue("address")}</div>,
  },
  {
    accessorKey: "token",
    header: "Token",
    cell: ({ row }) => <div>{row.getValue("token")}</div>,
  },
  {
    accessorKey: "cadence",
    header: () => <div>Cadence</div>,
    cell: ({ row }) => (
      <div className="lowercase">{row.getValue("cadence")}</div>
    ),
  },
  {
    accessorKey: "chain",
    header: () => <div>Chain</div>,
    cell: ({ row }) => <div className="lowercase">{row.getValue("chain")}</div>,
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));

      // Format the amount as a dollar amount
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);

      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row, ...rest }) => {
      return (
        <Button
          variant="destructive"
          className="float-right"
          onClick={() => {
            rest.table.options.onDelete(row.original.address);
          }}
        >
          Delete
        </Button>
      );
    },
  },
];

const formSchema = z.object({
  address: z.string(),
  amount: z.number(),
  token: z.string(),
  cadence: z.string(),
  chain: z.string(),
  receivers: z.array(
    z.object({
      address: z.string(),
      token: z.string(),
      amount: z.number(),
      cadence: z.string(),
      chain: z.string(),
    })
  ),
});

export function Create() {
  const {
    data: fetchedReceivers,
    isError,
    isLoading,
  } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: payrollHandlerAbi,
    functionName: "getReceivers",
    args: [],
  });

  console.log(fetchedReceivers, isError, isLoading);

  const {
    data: writeData,
    isLoading: writeIsLoading,
    isSuccess: writeIsSuccess,
    write,
  } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: payrollHandlerAbi,
    functionName: "modifyPayRollBatch",
  });

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      receivers: receiversMock,
      address: "0x8a99613c003468079f948fd257c53BC30c788bAE",
      token: "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83",
      amount: 100,
      cadence: "3600",
      chain: "100",
    },
  });

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);

    // push to receivers
    form.setValue("receivers", [
      ...form.getValues().receivers,
      {
        address: values.address,
        token: values.token,
        amount: values.amount,
        cadence: values.cadence,
        chain: values.chain,
      },
    ]);

    write({
      args: [[values.address], [[1000, values.token, 100, 100, 100]]],
    });
  }

  const receivers = form.watch("receivers");

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data: receivers,
    columns,
    onDelete: (address) => {
      form.setValue(
        "receivers",
        receivers.filter((receiver) => receiver.address !== address)
      );
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <>
      <h2 className="my-8 text-2xl">Create payroll</h2>

      <div className="w-full">
        <div className="flex items-center py-4">
          <Input
            placeholder="Filter ..."
            value={
              (table.getColumn("address")?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn("address")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full gap-x-3 flex rounded-md border pt-2 pb-4 px-4 mt-5 items-end"
          >
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receiver</FormLabel>
                  <FormControl>
                    <Input placeholder="0x0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="token"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token</FormLabel>
                  <FormControl>
                    <Input placeholder="0x0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cadence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cadence</FormLabel>
                  <FormControl>
                    <Input placeholder="3600" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly rate</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="2500.00"
                      type="number"
                      {...field}
                      onChange={(event) =>
                        field.onChange(Number(event.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="chain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chain</FormLabel>
                  <FormControl>
                    <Input placeholder="Gnosis" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={writeIsLoading}>
              {writeIsLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add
            </Button>
          </form>
        </Form>

        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default Create;
