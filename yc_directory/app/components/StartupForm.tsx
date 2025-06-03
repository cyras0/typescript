"use client"

import React, {useActionState, useState} from "react";
import {Input} from "@/components/ui/input";
import MDEditor from '@uiw/react-md-editor';
import { Button } from "./ui/button";
import { Router, Send } from "lucide-react";
import { formSchema } from "@/lib/validation";
import { useFormState } from "react-dom";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createPitch } from "@/lib/actions";

const StartupForm = () => {
  const [error, setError] = useState<Record<string, string>>({});

  const [pitch, setPitch] = useState("");

  const router = useRouter();
  
  const handleFormSubmit = async (previousState: any, formData: FormData) => {
    try {
      const formValues = {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        category: formData.get("category") as string,
        link: formData.get("link") as string,
        pitch: formData.get("pitch") as string,
      }
      
      await formSchema.parseAsync(formValues);
      console.log(formValues);
     
      console.log("createPitch starts  ");  
      console.log(pitch);

      const result = await createPitch(previousState, formData, pitch)

      if(result.status == "SUCCESS") {
        toast.success("Success", {
          description: "Your pitch has been created successfully",
        });
        console.log("createPitch success  ");  
      } else {
        toast.error("Error", {
          description: "Something went wrong",
        });
        console.log("createPitch error  ");  
        console.log(result);
      }
      router.push(`/startup/${result._id}`);
      return result

    } catch (error) {
      if(error instanceof z.ZodError) {
        const fieldErrors = error.flatten().fieldErrors;
        setError(fieldErrors as unknown as Record<string, string>);

        toast.error("Validation failed", {
          description: "Please check your inputs and try again",
        });
        console.log("validation failed  ");  
        console.log(fieldErrors);

        return {... previousState, error: 'Validation failed', status: "ERROR"};
      }
      
      toast.error("Error", {
        description: "Something went wrong",
      });

      return {... previousState, error: 'Something went wrong', status: "ERROR"};
    } 

    return {error: {}, status: "SUCCESS"};
  }

  
  const [state, formAction, isPending] = useActionState(handleFormSubmit, {
    error: "",
    status: "INITIAL",
  });
  
  return (
    <form action={formAction} className="startup-form">
      <div>
        <label htmlFor="title" className="startup-form-label">
          Title
        </label>
        <Input 
           id="title" 
           name="title" 
           className="startup-form_input"
           required
           placeholder="startup Title"
        />

        {error.title && <p className="startup-form-error">{error.title}</p>}
      </div>
      <div>
        <label htmlFor="description" className="startup-form-label">
        Description
        </label>
        <Input 
           id="description" 
           name="description" 
           className="startup-form_textarea"
           required
           placeholder="startup Description"
        />

        {error.description && <p className="startup-form-error">{error.description}</p>}
      </div>
      <div>
        <label htmlFor="category" className="startup-form-label">
          Category
        </label>
        <Input 
           id="category" 
           name="category" 
           className="startup-form_input"
           required
           placeholder="startup Category (Tech, Health, Education, Sports, etc.)"
        />

        {error.category && <p className="startup-form-error">{error.category}</p>}
      </div>
      <div>
        <label htmlFor="link" className="startup-form-label">
          Image URL
        </label>
        <Input 
           id="link" 
           name="link" 
           className="startup-form_input"
           required
           placeholder="startup Image URL"
        />

        {error.link && <p className="startup-form-error">{error.link}</p>}
      </div>
      <div data-color-mode="light">
        <label htmlFor="pitch" className="startup-form-label">
          Pitch
        </label>
        <MDEditor
           value={pitch}
           onChange={(value) => setPitch(value as string)}
           id="pitch"
           preview="edit"
           height={300}
           style={{ borderRadius: 20, overflow: "hidden" }}
           textareaProps={{
            placeholder: "Breiefly describe your idea and what problem it solves...",
           }}
           previewOptions={{
            disallowedElements: ["style"],
           }}
        />
        {error.pitch && <p className="startup-form-error">{error.pitch}</p>}
      </div>

      <Button type="submit" className="startup-form_btn" disabled={isPending}>
         {isPending ? "Submitting..." : "Submit your pitch"}
         <Send className="size-6 ml-2" />
      </Button>
    </form>
  )
}

export default StartupForm;

