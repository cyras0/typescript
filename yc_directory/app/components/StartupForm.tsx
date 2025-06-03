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
    console.log("=== FORM SUBMIT STARTED ===");
    
    try {
      // Debug: Log all form data
      console.log("Raw FormData entries:");
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }
      
      const formValues = {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        category: formData.get("category") as string,
        link: formData.get("link") as string,
        pitch: pitch, // Use state value instead of formData.get("pitch")
      }
      
      console.log("Form values to validate:", formValues);
      console.log("Pitch state value:", pitch);
      
      // Add validation debugging
      console.log("Starting validation...");
      await formSchema.parseAsync(formValues);
      console.log("Validation passed!");
      
      console.log("createPitch starts");
      const result = await createPitch(previousState, formData, pitch)

      if(result.status == "SUCCESS") {
        toast.success("Success", {
          description: "Your pitch has been created successfully",
        });
        console.log("createPitch success");
        router.push(`/startup/${result._id}`);
      } else {
        toast.error("Error", {
          description: "Something went wrong",
        });
        console.log("createPitch error:", result);
      }
      
      return result

    } catch (error) {
      console.log("=== ERROR CAUGHT ===");
      console.log("Error type:", error.constructor.name);
      console.log("Error:", error);
      
      if(error instanceof z.ZodError) {
        const fieldErrors = error.flatten().fieldErrors;
        setError(fieldErrors as unknown as Record<string, string>);

        toast.error("Validation failed", {
          description: "Please check your inputs and try again",
        });
        console.log("Zod validation failed");
        console.log("Field errors:", fieldErrors);

        return {... previousState, error: 'Validation failed', status: "ERROR"};
      }
      
      toast.error("Error", {
        description: "Something went wrong",
      });
      console.log("Non-validation error");

      return {... previousState, error: 'Something went wrong', status: "ERROR"};
    }
  }

  
  const [state, formAction, isPending] = useActionState(handleFormSubmit, {
    error: "",
    status: "INITIAL",
  });
  
  return (
    <form action={formAction} className="startup-form">
      <input type="hidden" name="pitch" value={pitch} />
      
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

