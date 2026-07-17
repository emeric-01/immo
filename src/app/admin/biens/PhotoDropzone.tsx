"use client";

import { useRef } from "react";
import { GripVertical, ImagePlus, Star, X } from "lucide-react";
import styles from "../properties.module.css";

export function PhotoDropzone({ files, onChange }: { files: File[]; onChange: (files: File[]) => void }) {
  const dragged = useRef<number|null>(null);
  const add = (incoming: FileList|File[]) => onChange([...files,...Array.from(incoming).filter(file=>file.type.startsWith("image/"))].slice(0,30));
  return <div><label className={styles.dropzone} onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();add(event.dataTransfer.files)}}><ImagePlus/><strong>Glissez vos photos ici</strong><span>ou cliquez pour parcourir — 30 images maximum, compression automatique</span><input accept="image/jpeg,image/png,image/webp" multiple onChange={event=>event.target.files&&add(event.target.files)} type="file"/></label>
    {files.length?<div className={styles.newPhotoList}>{files.map((file,index)=><article draggable key={`${file.name}-${file.lastModified}`} onDragStart={()=>{dragged.current=index}} onDragOver={event=>event.preventDefault()} onDrop={()=>{if(dragged.current===null||dragged.current===index)return;const next=[...files];const [item]=next.splice(dragged.current,1);next.splice(index,0,item);dragged.current=null;onChange(next)}}><GripVertical/><div><strong>{index===0?<><Star/> Photo principale</>: `Photo ${index+1}`}</strong><span>{file.name} · {Math.round(file.size/1024)} Ko</span></div><button aria-label={`Retirer ${file.name}`} onClick={()=>onChange(files.filter((_,i)=>i!==index))} type="button"><X/></button></article>)}</div>:null}
  </div>;
}
