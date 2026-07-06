import CheckboxInput from "./CheckBoxInput";
import NumberInput from "./NumberInput";
import PropertySection from "./propertiesSection";
import PropertyField from "./PropertyField";
import TextInput from "./TextInput";

interface AppearanceSectionProps {
    selectedBlock: any;

    updateNodeStyle: (
        id: number,
        styleName: string,
        value: string|number
    ) => void;

    heightChangeAllowed?:boolean;

    typographyAvailable?:boolean;

    marginAvailable?:boolean;
}

function AppearanceSection({ selectedBlock, updateNodeStyle, heightChangeAllowed=false, typographyAvailable=false, marginAvailable=false}: AppearanceSectionProps) {

    return (
        <div className="appearance">
            <PropertySection title="Layout">
            <div>
                <PropertyField label="Width">

                <TextInput
                    
                    value={selectedBlock.props.style.width}
                    onChange={(e) =>
                        updateNodeStyle(
                            selectedBlock.id,
                            "width",
                            (e.target.value)
                        )
                    }
                />
                </PropertyField>
            </div>

            {heightChangeAllowed && 
                <PropertyField label="Height">
                <TextInput
                    
                    value={selectedBlock.props.style.height}
                    onChange={(e) =>
                        updateNodeStyle(
                            selectedBlock.id,
                            "height",
                            (e.target.value)
                        )
                    }
                />

                </PropertyField>}

            <div>
                <PropertyField label="Padding">

                <NumberInput
                    
                    min={0}
                    value={selectedBlock.props.style.padding}
                    onChange={(e) =>
                        updateNodeStyle(
                            selectedBlock.id,
                            "padding",
                            Number(e.target.value)
                        )
                    }
                />
                </PropertyField>
            </div>

             {marginAvailable && <div>
                <PropertyField label="Margin Top">
                <NumberInput
                    
                    min={0}
                    value={selectedBlock.props.style.marginTop}
                    onChange={(e) =>
                        updateNodeStyle(
                            selectedBlock.id,
                            "marginTop",
                            Number(e.target.value)
                        )
                    }/>
                </PropertyField>

                <PropertyField label="Margin Bottom">
                <NumberInput
                    
                    min={0}
                    value={selectedBlock.props.style.marginBottom}
                    onChange={(e) =>
                        updateNodeStyle(
                            selectedBlock.id,
                            "marginBottom",
                            Number(e.target.value)
                        )
                    }
                />                    
                </PropertyField>
                 </div>}
            </PropertySection>
                                              
            
            {typographyAvailable &&
            <PropertySection title="Typography">
            <div>
                <PropertyField label="Font Size">
                <NumberInput
                    
                    min={8}
                    max={72}
                    value={selectedBlock.props.style.fontSize}
                    onChange={(e) =>
                        updateNodeStyle(
                            selectedBlock.id,
                            "fontSize",
                            Number(e.target.value)
                        )
                    }
                />
                </PropertyField>

            </div>  

            <div>
                
                <CheckboxInput label="bold"
                    checked={selectedBlock.props.style.fontWeight === "bold"}
                    onChange={(e) =>
                        updateNodeStyle(
                            selectedBlock.id,
                            "fontWeight",
                            e.target.checked ? "bold" : "normal"
                        )
                    }
                />                    


            </div>  

            <div>
                
                <CheckboxInput label="Italic"
                    checked={selectedBlock.props.style.fontStyle === "italic"}
                    onChange={(e) =>
                        updateNodeStyle(
                            selectedBlock.id,
                            "fontStyle",
                            e.target.checked ? "italic" : "normal"
                        )
                    }
                />                    


            </div>
            </PropertySection>         
            }

                                                     
        </div>
    );
}

export default AppearanceSection;