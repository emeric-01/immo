"use client";

import { useEffect, useMemo, useRef } from "react";
import { GripVertical, ImagePlus, Star, X } from "lucide-react";
import styles from "../properties.module.css";

export function PhotoDropzone({
  files,
  onChange,
  existingCount = 0,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  existingCount?: number;
}) {
  const dragged = useRef<number|null>(null);
  const previews = useMemo(() => files.map(file => URL.createObjectURL(file)), [files]);
  useEffect(() => () => previews.forEach(url => URL.revokeObjectURL(url)), [previews]);
  const availableSlots = Math.max(0, 30 - existingCount);
  const add = (incoming: FileList|File[]) => onChange([...files,...Array.from(incoming).filter(file=>file.type.startsWith("image/"))].slice(0,availableSlots));
  return <div><label className={styles.dropzone} onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();add(event.dataTransfer.files)}}><ImagePlus/><strong>Glissez vos photos ici</strong><span>ou cliquez pour parcourir — 30 images maximum, compression automatique</span><input accept="image/jpeg,image/png,image/webp" multiple onChange={event=>event.target.files&&add(event.target.files)} type="file"/></label>
    {files.length?<div className={styles.newPhotoList}>{files.map((file,index)=><article draggable key={`${file.name}-${file.lastModified}-${index}`} onDragStart={()=>{dragged.current=index}} onDragOver={event=>event.preventDefault()} onDrop={()=>{if(dragged.current===null||dragged.current===index)return;const next=[...files];const [item]=next.splice(dragged.current,1);next.splice(index,0,item);dragged.current=null;onChange(next)}}><div className={styles.newPhotoPreview} style={{backgroundImage:`url(${previews[index]})`}}><span><GripVertical/> {existingCount===0&&index===0?<><Star/> Principale</>:`Position ${existingCount+index+1}`}</span></div><div className={styles.newPhotoMeta}><strong>{file.name}</strong><span>{Math.round(file.size/1024)} Ko · sera optimisée en WebP</span></div><button aria-label={`Retirer ${file.name}`} onClick={()=>onChange(files.filter((_,i)=>i!==index))} type="button"><X/></button></article>)}</div>:null}
  </div>;
}
