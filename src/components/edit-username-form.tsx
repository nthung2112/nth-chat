"use client";

import React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useUserPreferencesStore } from "@/stores";

import { ModeToggle } from "./mode-toggle";

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
});

export default function EditUsernameForm() {
  const userName = useUserPreferencesStore(state => state.userName);
  const setUserName = useUserPreferencesStore(state => state.setUserName);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: userName,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setUserName(values.username); // Update the userName in the store
    toast.success("Name updated successfully");
  }

  return (
    <Form {...form}>
      <div className="flex w-full flex-col gap-4 pt-4">
        <FormLabel>Theme</FormLabel>
        <ModeToggle />
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <div className="gap-4 md:flex">
                  <Input {...field} type="text" placeholder="Enter your name" />
                  <Button type="submit">Change name</Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
