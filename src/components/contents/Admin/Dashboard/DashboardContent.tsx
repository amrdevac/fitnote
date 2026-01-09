import React from "react";
import { Input } from "ui/input";
import { Label } from "ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "ui/select";
import { Textarea } from "ui/textarea";
import DiaryPinSettingsCard from "./DiaryPinSettingsCard";

const DashboardContent: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6">Dashboard</h1>
      <div className="space-y-6">
        <DiaryPinSettingsCard />
        <div>
          <Label htmlFor="basic">Basic Input</Label>
          <Input id="basic" placeholder="Type here" />
        </div>
        <div>
          <Label htmlFor="area">Textarea</Label>
          <Textarea id="area" placeholder="Write something..." />
        </div>
        <div>
          <Label>Select</Label>
          <Select>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Choose" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="one">One</SelectItem>
              <SelectItem value="two">Two</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
