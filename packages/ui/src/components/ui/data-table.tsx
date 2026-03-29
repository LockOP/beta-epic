"use client"

import * as React from "react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table"

export type DataTableColumn<TData> = {
  key: keyof TData | string
  header: React.ReactNode
  cell?: (row: TData) => React.ReactNode
}

export type DataTableProps<TData> = {
  columns: Array<DataTableColumn<TData>>
  data: TData[]
  emptyMessage?: React.ReactNode
}

export function DataTable<TData extends Record<string, unknown>>({
  columns,
  data,
  emptyMessage = "No results.",
}: DataTableProps<TData>) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={String(column.key)}>{column.header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length > 0 ? (
          data.map((row, index) => (
            <TableRow key={index}>
              {columns.map((column) => (
                <TableCell key={String(column.key)}>
                  {column.cell
                    ? column.cell(row)
                    : (row[column.key as keyof TData] as React.ReactNode)}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center">
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
