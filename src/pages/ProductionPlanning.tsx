import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue,
  SelectContent, SelectItem
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow
} from "@/components/ui/table";

type Item = {
  id: number;
  name: string;
  priority: "High" | "Medium" | "Low";
};

type Machine = {
  id: number;
  name: string;
  status: "idle" | "busy";
};

type Assignment = {
  item: Item;
  machine: Machine;
};

export default function ProductionPlanning() {
  const [items, setItems] = useState<Item[]>([]);
  const [machines, setMachines] = useState<Machine[]>([
    { id: 1, name: "Mesin A", status: "idle" },
    { id: 2, name: "Mesin B", status: "idle" },
    { id: 3, name: "Mesin C", status: "idle" },
  ]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [itemName, setItemName] = useState("");
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");

  const handleAddItem = () => {
    const newItem: Item = {
      id: Date.now(),
      name: itemName,
      priority,
    };
    const availableMachine = machines.find(m => m.status === "idle");
    if (availableMachine) {
      availableMachine.status = "busy";
      setMachines([...machines]);
      setAssignments([...assignments, { item: newItem, machine: availableMachine }]);
    }
    setItems([...items, newItem]);
    setItemName("");
    setPriority("Medium");
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Input Barang</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nama Barang</Label>
            <Input value={itemName} onChange={(e) => setItemName(e.target.value)} />
          </div>
          <div>
            <Label>Prioritas</Label>
            <Select value={priority} onValueChange={(val) => setPriority(val as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAddItem}>Tambah & Alokasikan</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alokasi Barang ke Mesin</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Barang</TableHead>
                <TableHead>Prioritas</TableHead>
                <TableHead>Mesin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assign, index) => (
                <TableRow key={index}>
                  <TableCell>{assign.item.name}</TableCell>
                  <TableCell>{assign.item.priority}</TableCell>
                  <TableCell>{assign.machine.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
