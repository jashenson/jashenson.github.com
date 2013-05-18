var data = [
    {
        name: "Porphyria family history",
        evoke: 3,
        freq: 3,
        imp: 3
    },
    {
        name: "Abdomen pain epigastrium recurrent attacks history",
        evoke: 1,
        freq: 1,
        imp: 2
    },
    {
        name: "Abdomen pain right upper quadrant recurrent attacks history",
        evoke: 1,
        freq: 1,
        imp: 2
    },
    {
        name: "Alcoholism chronic history",
        evoke: 1,
        freq: 1,
        imp: 3
    },
    {
        name: "Pheytoin administration prior to current illness history",
        evoke: 1,
        freq: 1,
        imp: 2
    },
    {
        name: "Seizures grand mal history",
        evoke: 1,
        freq: 1,
        imp: 2
    },
    {
        name: "Estrogen administration prior to current illness history",
        evoke: 1,
        freq: 2,
        imp: 2
    },
    {
        name: "Pregnancy postpartum improvement of disease history",
        evoke: 1,
        freq: 2,
        imp: 2
    },
    {
        name: "Pregnancy exacerbation of disease history",
        evoke: 1,
        freq: 2,
        imp: 2
    },
    {
        name: "Sulfonamide administration prior to current illness history",
        evoke: 1,
        freq: 2,
        imp: 1
    },    
    {
        name: "Hypertension abrupt onset",
        evoke: 1,
        freq: 3,
        imp: 3
    },
    {
        name: "Urine dark history",
        evoke: 1,
        freq: 4,
        imp: 1
    },
    {
        name: "Barbiturate administration prior to current illness history",
        evoke: 1,
        freq: 2,
        imp: 1
    },
    {
        name: "Alcohol ingestion heavy recent history",
        evoke: 1,
        freq: 1,
        imp: 3
    },
    {
        name: "Age 26 to 55",
        evoke: 0,
        freq: 3,
        imp: 3
    }                         
];


$(document).ready(function(){

    $(".list").each( function(){
        $list = $(this);
        
        if ($list.hasClass('numbers')) {
            
            $.each(data, function(idx, item){
                $node = $("<li/>")
                        .append( '<span class="graph-item evoke">'+item.evoke+'</span>' )
                        .append( '<span class="graph-item freq">'+item.freq+'</span>' )
                        .append( '<span class="graph-item imp">'+item.imp+'</span>' )
                        .append( item.name )
                        .appendTo( $list );
            });    

        } else {
                   
            $.each(data, function(idx, item){
                $node = $("<li/>")
                        .append( '<span class="graph-item evoke ' + 's' + item.evoke + '"></span>' )
                        .append( '<span class="graph-item freq ' + 's' + item.freq + '"></span>' )
                        .append( '<span class="graph-item imp ' + 's' + item.imp + '"></span>' )
                        .append( item.name )
                        .appendTo( $list );
            });    
            
        }
    });

});