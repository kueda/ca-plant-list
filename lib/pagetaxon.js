import * as fs from "node:fs";
import { HTML, HTML_OPTIONS } from "./html.js";
import { Jepson } from "./jepson.js";
import { HTMLPage } from "./htmlpage.js";
import { Config } from "./config.js";

class PageTaxon extends HTMLPage {

    #taxon;

    constructor( taxon ) {
        super();
        this.#taxon = taxon;
    }

    #getInfoLinks() {
        const links = [];
        const jepsonID = this.#taxon.getJepsonID();
        if ( jepsonID ) {
            links.push( Jepson.getEFloraLink( jepsonID ) );
        }
        const calRecNum = this.#taxon.getCalRecNum();
        if ( calRecNum ) {
            links.push(
                HTML.getLink(
                    "https://www.calflora.org/app/taxon?crn=" + calRecNum,
                    "Calflora",
                    {},
                    HTML_OPTIONS.OPEN_NEW
                )
            );
        }
        const iNatID = this.#taxon.getINatID();
        if ( iNatID ) {
            links.push(
                HTML.getLink(
                    "https://www.inaturalist.org/taxa/" + iNatID,
                    "iNaturalist",
                    {},
                    HTML_OPTIONS.OPEN_NEW
                )
            );
        }
        return links;
    }

    #getObsLinks() {
        const links = [];
        links.push(
            HTML.getLink(
                "https://www.calflora.org/entry/observ.html?track=m#srch=t&grezc=5&cols=b&lpcli=t&cc="
                + Config.getConfigValue( "calflora", "counties" ).join( "!" ) + "&incobs=f&taxon="
                + this.#taxon.getCalfloraName().replaceAll( " ", "+" ),
                "Calflora",
                {},
                HTML_OPTIONS.OPEN_NEW
            )
        );
        const iNatID = this.#taxon.getINatID();
        if ( iNatID ) {
            links.push(
                HTML.getLink(
                    "https://www.inaturalist.org/observations?project_id=" + Config.getConfigValue( "inat", "project" )
                    + "&quality_grade=research&subview=map&taxon_id=" + iNatID,
                    "iNaturalist",
                    {},
                    HTML_OPTIONS.OPEN_NEW
                )
            );
        }

        return links;
    }

    #getListSectionHTML( list, header, className ) {
        let html = "";
        if ( list.length > 0 ) {
            html += "<div class=\"section " + className + "\">";
            html += HTML.getElement( "h2", header );
            html += "<ul>";
            html += HTML.arrayToLI( list );
            html += "</ul>";
            html += "</div>";
        }
        return html;
    }

    #getRelatedTaxaLinks() {
        const links = [];
        const genus = this.#taxon.getGenus();
        if ( genus ) {
            const taxa = genus.getTaxa();
            for ( const taxon of taxa ) {
                if ( taxon.getName() !== this.#taxon.getName() ) {
                    links.push(
                        HTML.getLink(
                            "./" + taxon.getFileName(),
                            taxon.getName(),
                            { class: taxon.getHTMLClassName() }
                        )
                    );
                }
            }
        }
        return links;
    }

    #getSynonyms() {
        return this.#taxon.getSynonyms();
    }

    render( outputDir ) {

        let html = this.getFrontMatter( this.#taxon.getName() );

        html += HTML.getElement( "h1", this.#taxon.getName() );

        html += "<div class=\"wrapper\">";

        const cn = this.#taxon.getCommonNames();
        if ( cn.length > 0 ) {
            html += HTML.getElement( "div", cn.join( ", " ), { class: "section common-names" } );
        }
        html += HTML.getElement( "div", this.#taxon.getStatusDescription(), { class: "section" } );

        const family = this.#taxon.getFamily();
        html += HTML.getElement(
            "div",
            "Family: " + HTML.getLink( "./" + family.getFileName(), family.getName() ),
            { class: "section" },
            HTML_OPTIONS.NO_ESCAPE
        );

        html += "</div>";

        const introName = "intros/" + this.#taxon.getFileName( "md" );
        if ( fs.existsSync( "./jekyll/_includes/" + introName ) ) {
            html += HTML.getElement( "div", "{% capture my_include %}{% include " + introName + "%}{% endcapture %}{{ my_include | markdownify }}" );
        }

        html += "<div class=\"wrapper\">";
        html += this.#getListSectionHTML( this.#getInfoLinks(), "Information", "info" );
        html += this.#getListSectionHTML( this.#getObsLinks(), "Observations", "obs" );
        html += this.#getListSectionHTML( this.#getRelatedTaxaLinks(), "Related Species", "rel-taxa" );
        html += this.#getListSectionHTML( this.#getSynonyms(), "Synonyms", "synonyms" );
        html += "</div>";

        this.writeFile( outputDir, this.#taxon.getFileName(), html );

    }

}

export { PageTaxon };