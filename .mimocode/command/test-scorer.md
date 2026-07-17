---
description: "Test a scoring script against mock submission results. Pass script as $ARGUMENTS."
agent: main
---

# test-scorer

Run a scoring script with mock test case results and display the output. Useful for debugging scoring logic without a full judge run.

## Usage

```
/test-scorer "if @status1==AC; then @total_score=100; @final_status=AC; fi"
```

The script receives mock results where `@status1..@statusN` are AC/WA/TLE/MLE/UNAC/CE.

## Steps

1. **Run the scorer inline** (pass $ARGUMENTS as the script):
   ```powershell
   node -e "const {runScoringScript}=require('./sandbox/scorer');const script='$ARGUMENTS';const result=runScoringScript(script);console.log(JSON.stringify(result,null,2))"
   ```
   Working directory: `D:\Desktop\winoj\mimo\backend`

2. **For per-test-case scoring** (with aggregator):
   ```powershell
   node -e "const {runScoringScript}=require('./sandbox/scorer');const script='if @status4==AC and (@status3==AC or @status5==AC); then @total_score=30; fi';const results=[{test_case_id:1,status:'AC',score:10,time_ms:100,memory_kb:1024},{test_case_id:2,status:'AC',score:10,time_ms:100,memory_kb:1024},{test_case_id:3,status:'AC',score:10,time_ms:100,memory_kb:1024},{test_case_id:4,status:'WA',score:0,time_ms:50,memory_kb:512},{test_case_id:5,status:'AC',score:10,time_ms:80,memory_kb:768}];const result=runScoringScript(script,results);console.log(JSON.stringify(result,null,2))"
   ```
   Working directory: `D:\Desktop\winoj\mimo\backend`

3. **Report** the output: `@total_score`, `@final_status`, and any other variables set by the script.
