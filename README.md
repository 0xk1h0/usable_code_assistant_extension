## UserStudy (AI-powered Coding Assistant tools)

### Notification
This extension is currently not available for public use. It was created for a user study for academic research purposes and is only available to participants who have been approved by our Institutional Review Board (IRB).

### About Our Extension

1. Languages Supported
   
   This extension currently only supports Python, but we plan to add additional languages in future releases.

2. Modules Trained On
   
   The model used in our extension was trained on Python code, covering the tasks used in our user study.

3. How Extension Works
   
   Our extension uses a large language model (LLM) called [CodeGen] to generate or complete code. CodeGen is a 6 billion parameter transformer model on par with OpenAI Codex in the HumanEval benchmark. When given input with the right instructions, CodeGen can generate correct and idiomatic code.

#### Extension Usage Example
To use the extension, you can type a sentence that describes the code you want to generate, followed by # Please write a code to ... and then press Enter. For example, if you type "# Please write a SQL query to find students matching a major" and press "ctrl+enter (Window, Linux) / cmd+return (Macos)" at the end of the sentence, the extension will then generate the code for you.

#### We do not recommend installing this extension if you do not participate in our user study. 

[CodeGen]: https://github.com/salesforce/CodeGen/tree/main/codegen1