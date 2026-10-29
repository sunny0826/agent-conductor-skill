const search = document.querySelector('#search');
const catalog = document.querySelector('#catalog');
const select = document.querySelector('#skill-select');
const prompt = document.querySelector('#prompt-text');
const copyStatus = document.querySelector('#copy-status');
function node(tag,text,className){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el}
const entries = skills.map(([name,group,goal,result,boundary])=>{
  const item=node('details',undefined,'skill');
  const summary=node('summary');summary.append(node('code',name,'skill-name'),node('span',goal,'goal'));item.append(summary);
  const body=node('div',undefined,'skill-body');body.append(node('p','得到：'+result),node('p','边界：'+boundary,'boundary'));
  const source=node('div',undefined,'source');const link=node('a','读 SKILL.md');link.href='../skills/'+name+'/SKILL.md';source.append(link);
  if(group!==5){const use=node('button','用于提示');use.type='button';use.addEventListener('click',()=>{select.value=name;updatePrompt();document.querySelector('#prompt').scrollIntoView();select.focus({preventScroll:true})});source.append(use)}
  body.append(source);item.append(body);
  return {name,group,element:item,text:[name,groups[group],goal,result,boundary].join(' ').toLowerCase()};
});
const sections=groups.map((title,index)=>{
  const group=node('details',undefined,'group');const summary=node('summary',title);summary.append(node('small',String(entries.filter(e=>e.group===index).length)+' 个'));group.append(summary);
  const container=node('div',undefined,'skills');entries.filter(e=>e.group===index).forEach(e=>container.append(e.element));group.append(container);catalog.append(group);return group;
});
function filter(){
  const words=search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);let count=0;
  entries.forEach(e=>{e.element.hidden=!words.every(word=>e.text.includes(word));if(!e.element.hidden)count++});
  sections.forEach((el,i)=>{el.hidden=!entries.some(e=>e.group===i&&!e.element.hidden);if(words.length)el.open=!el.hidden});
  document.querySelector('#count').textContent=words.length?'找到 '+count+' 个技能':'31 个任务技能 · 24 个原则技能；点分类展开，或搜索任务名称。';
  document.querySelector('#empty').hidden=count!==0;
}
entries.filter(e=>e.group!==5).forEach(e=>{const option=node('option',e.name);option.value=e.name;select.append(option)});
function updatePrompt(){
  prompt.textContent='使用 $'+select.value+' 帮我完成【目标】。\n范围：【项目、文件或功能】。\n完成条件：【能观察到的结果】。\n已知信息：【症状、复现、日志或链接】。\n限制与授权：【预算、只读或可修改范围、需要保留的人工关口】。\n请按任务给出产物、证据和未完成项。';
  copyStatus.textContent='';
}
document.querySelector('#copy').addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(prompt.textContent);copyStatus.textContent='已复制'}
  catch{const range=document.createRange();range.selectNodeContents(prompt);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);copyStatus.textContent='请按 ⌘C 或 Ctrl+C 复制已选中的提示'}
});
search.addEventListener('input',filter);select.addEventListener('change',updatePrompt);filter();updatePrompt();
