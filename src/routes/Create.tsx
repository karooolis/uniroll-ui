import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import truncateEthAddress from "truncate-eth-address";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
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

import payrollHandlerAbi from "../abis/payroll-handler.json";

import { useContractRead, useContractWrite } from "wagmi";
import { readContracts, writeContract, waitForTransaction } from "@wagmi/core";
import { CONTRACT_ADDRESS } from "@/consts";

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
    cell: ({ row }) => <div>{truncateEthAddress(row.getValue("address"))}</div>,
  },
  {
    accessorKey: "token",
    header: "Token",
    cell: ({ row }) => <div>{truncateEthAddress(row.getValue("token"))}</div>,
  },
  {
    accessorKey: "cadence",
    header: () => <div>Cadence</div>,
    cell: ({ row }) => (
      <div className="lowercase">{Number(row.getValue("cadence"))}</div>
    ),
  },
  {
    accessorKey: "chain",
    header: () => <div>Chain</div>,
    cell: ({ row }) => (
      <div className="lowercase">{Number(row.getValue("chain"))}</div>
    ),
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

  const [fetchedConfigs, setFetchedConfigs] = React.useState<any[]>([]);
  const [loadingConfigs, setLoadingConfigs] = React.useState(false);

  const fetchConfigs = React.useCallback(async () => {
    setLoadingConfigs(true);

    const data = await readContracts({
      contracts: fetchedReceivers?.map((receiver, idx) => ({
        address: CONTRACT_ADDRESS,
        abi: payrollHandlerAbi,
        functionName: "getConfigs",
        args: [idx],
      })),
    });

    setFetchedConfigs(
      data?.map(({ result }, idx) => {
        return {
          ...result,
          chain: Number(result.chainid),
          amount: Number(result.cadenceRate),
          address: fetchedReceivers[idx],
        };
      })
    );

    setLoadingConfigs(false);
  }, [fetchedReceivers]);

  React.useEffect(() => {
    if (fetchedReceivers) {
      fetchConfigs();
    }
  }, [fetchedReceivers, fetchConfigs]);

  const [writeIsLoading, setWriteIsLoading] = React.useState(false);

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      receivers: [],
      address: "0x8a99613c003468079f948fd257c53BC30c788bAE",
      token: "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83",
      amount: 100,
      cadence: "3600",
      chain: "100",
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);

    // push to receivers
    setWriteIsLoading(true);

    const { hash } = await writeContract({
      address: CONTRACT_ADDRESS,
      abi: payrollHandlerAbi,
      functionName: "modifyPayRollBatch",
      args: [
        [values.address],
        [[values.amount, values.token, values.chain, values.cadence, 0]],
      ],
    });

    setFetchedConfigs(
      fetchedConfigs.concat({
        address: values.address,
        token: values.token,
        amount: values.amount,
        cadence: values.cadence,
        chain: values.chain,
      })
    );

    setWriteIsLoading(false);
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
    data: fetchedConfigs,
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
    pageSize: 100,
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
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
                <FormItem className="w-1/5">
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
                <FormItem className="w-1/5">
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
                // <FormItem>
                //   <FormLabel>Cadence</FormLabel>
                //   <FormControl>
                //     <Input placeholder="3600" {...field} />
                //   </FormControl>
                //   <FormMessage />
                // </FormItem>

                <FormField
                  control={form.control}
                  name="cadence"
                  render={({ field }) => (
                    <FormItem className="w-1/5">
                      <FormLabel>Cadence</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a verified email to display" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="3600">Hourly</SelectItem>
                          <SelectItem value="86400">Daily</SelectItem>
                          <SelectItem value="604800">Weekly</SelectItem>
                          <SelectItem value={String(60 * 60 * 24 * 30)}>Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="w-1/5">
                  <FormLabel>Cadence rate</FormLabel>
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

            {/* <FormField
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
            /> */}

            <FormField
              control={form.control}
              name="chain"
              render={({ field }) => (
                <FormItem className="w-1/5">
                  <FormLabel>Chain</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a verified email to display" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">Ethereum</SelectItem>
                      <SelectItem value="100">Gnosis</SelectItem>
                      <SelectItem value="42220">Celo</SelectItem>
                    </SelectContent>
                  </Select>
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
