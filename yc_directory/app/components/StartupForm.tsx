"use client"

import React, {useState} from "react";
import {Input} from "@/components/ui/input";

const StartupForm = () => {
  const [error, setError] = useState<Record<string, string>>({});


  return (
    <form action={() => {}} className="startup-form">
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
    </form>
  )
}

export default StartupForm;

