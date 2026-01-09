"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "ui/dialog";

const ComponentsContent: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6">Components</h1>
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open Dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Example Dialog</DialogTitle>
            <DialogDescription>
              This is a reusable modal component.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComponentsContent;
