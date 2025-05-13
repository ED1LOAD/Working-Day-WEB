import React, { useState } from "react";
import "../styles/signflowsend.css";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Checkbox, FormControlLabel, Button } from "@mui/material"; 

function getStatus(signer, index, signers) {
  if (signer.signed) return "Подписано";
  const isCurrent = !signer.signed && signers.slice(0, index).every(s => s.signed);
  return isCurrent ? "Сейчас" : "Ожидается";
}

function getStatusClass(signer, index, signers) {
  if (signer.signed) return "signed";
  const isCurrent = !signer.signed && signers.slice(0, index).every(s => s.signed);
  return isCurrent ? "current" : "pending";
}

export default function SignFlowSend({ signers, onRemove, editable = false, onReorder, onSignatureChange }) {
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(signers);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    onReorder?.(items);
  };
  

  const handleSignatureChange = (signerId) => {
    console.log("onSignatureChange:", onSignatureChange);  
    const updatedSigners = signers.map(signer =>
      signer.id === signerId ? { ...signer, requires_signature: !signer.requires_signature } : signer
    );
    if (onSignatureChange) {
      onSignatureChange(updatedSigners);  
    } else {
      console.error("onSignatureChange is undefined");
    }
  };
  

  const renderSigner = (signer, index) => (
    <React.Fragment key={signer.id}>
      <div className="signflowsend-col">
        {onRemove && editable && (
          <div className="signflowsend-remove" onClick={() => onRemove(signer.id)}>✕</div>
        )}
        <div className={`signflowsend-avatar ${getStatusClass(signer, index, signers)}`}>
          {signer.name[0]}
        </div>
        <div className="signflowsend-label">{signer.name}</div>
        <div className="signflowsend-status">{getStatus(signer, index, signers)}</div>
        {editable && (
          <Button
            variant={signer.requires_signature ? "contained" : "outlined"}
            color="primary"
            onClick={() => handleSignatureChange(signer.id)}
            sx={{
              mt: 1,
              backgroundColor: signer.requires_signature ? '#164f94' : 'transparent',
              color: signer.requires_signature ? '#fff' : '#164f94',
              border: '1px solid #164f94',
              '&:hover': {
                backgroundColor: signer.requires_signature ? '#133d73' : '#f0f4ff',
              }
            }}
          >
            {signer.requires_signature ? "Требуется подпись" : "Не требуется"}
          </Button>
        )}
      </div>
      {index < signers.length - 1 && (
        <div className="signflowsend-line-col-1">
          <div className={`signflowsend-line ${getStatusClass(signers[index + 1], index + 1, signers)}`} />
        </div>
      )}
    </React.Fragment>
  );


  if (!editable) {
    return <div className="signflowsend-grid">{signers.map(renderSigner)}</div>;
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="signers-droppable" direction="horizontal">
        {(provided) => (
          <div className="signflowsend-grid" ref={provided.innerRef} {...provided.droppableProps}>
            {signers.map((signer, index) => (
              <React.Fragment key={signer.id}>
                <Draggable draggableId={signer.id.toString()} index={index}>
                  {(provided) => (
                    <div
                      className="signflowsend-col"
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={provided.draggableProps.style}
                    >
                      {onRemove && (
                        <div
                          className="signflowsend-remove"
                          onClick={() => onRemove(signer.id)}
                        >✕</div>
                      )}
                      <div className={`signflowsend-avatar ${getStatusClass(signer, index, signers)}`}>
                        {signer.name[0]}
                      </div>
                      <div className="signflowsend-label">{signer.name}</div>
                      <div className="signflowsend-status">{getStatus(signer, index, signers)}</div>
                      {editable && (
                        <Button
                        variant={signer.requires_signature ? "contained" : "outlined"}
                        color="primary"
                        onClick={() => handleSignatureChange(signer.id)}
                        sx={{
                          mt: 1,
                          padding: "0px 10px", 
                          fontSize: "10px", 
                          backgroundColor: signer.requires_signature ? '#164f94' : 'transparent',
                          color: signer.requires_signature ? '#fff' : '#164f94',
                          border: '1px solid #164f94',
                          borderRadius: "10px", 
                          '&:hover': {
                            backgroundColor: signer.requires_signature ? '#133d73' : '#f0f4ff',
                          }
                        }}
                      >
                        {signer.requires_signature ? "Подпись: ДА" : "Подпись: НЕТ"}
                      </Button>
                      )}
                    </div>
                  )}
                </Draggable>
                {index < signers.length - 1 && (
                  <div className="signflowsend-line-col-2">
                    <div className={`signflowsend-line ${getStatusClass(signers[index + 1], index + 1, signers)}`} />
                  </div>
                )}
              </React.Fragment>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
